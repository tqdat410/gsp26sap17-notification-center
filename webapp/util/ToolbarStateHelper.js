/**
 * ToolbarStateHelper.js
 *
 * Updates toolbar button states based on table selection
 * - Delete button: "Delete" / "Delete All"
 * - Archive button: "Archive" / "Unarchive"
 * - Mark Read button: "Mark as Read" / "Mark as Unread" / "Mark All..."
 */
sap.ui.define([], function () {
    'use strict';

    return {
        updateToolbarButtons: function (oTable, oViewModel, oBundle) {
            var aSelected = oTable.getSelectedItems();
            var aItems = oTable.getItems();
            var bHasSel = aSelected.length > 0;

            oViewModel.setProperty('/hasSelection', bHasSel);
            oViewModel.setProperty('/deleteButtonText', oBundle.getText(bHasSel ? 'delete' : 'deleteAll'));

            if (bHasSel) {
                var bHasArchived = aSelected.some(function (o) {
                    var c = o.getBindingContext();
                    return c && c.getProperty('IsArchived');
                });
                oViewModel.setProperty('/archiveButtonText', oBundle.getText(bHasArchived ? 'unarchive' : 'archive'));
                oViewModel.setProperty('/archiveButtonIcon', bHasArchived ? 'sap-icon://folder-blank' : 'sap-icon://folder');
            }

            var aTarget = bHasSel ? aSelected : aItems;
            var bHasUnread = aTarget.some(function (o) {
                var c = o.getBindingContext();
                return c && !c.getProperty('IsRead');
            });

            if (bHasSel) {
                oViewModel.setProperty('/markReadButtonText', oBundle.getText(bHasUnread ? 'markRead' : 'markUnread'));
            } else {
                oViewModel.setProperty('/markReadButtonText', oBundle.getText(bHasUnread ? 'markAllRead' : 'markAllUnread'));
            }
            oViewModel.setProperty('/markReadButtonIcon', bHasUnread ? 'sap-icon://email-read' : 'sap-icon://email');
        }
    };
});
